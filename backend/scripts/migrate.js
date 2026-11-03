#!/usr/bin/env node

/**
 * Wrapper de migraciones de RepuSense.
 *
 * Comandos:
 *   node scripts/migrate.js up [N]       Aplica N migraciones pendientes (todas por defecto)
 *   node scripts/migrate.js down [N]     Revierte N migraciones (1 por defecto)
 *   node scripts/migrate.js redo [N]     Revierte y vuelve a aplicar N migraciones (1 por defecto)
 *   node scripts/migrate.js status       Muestra migraciones aplicadas, pendientes y faltantes
 *   node scripts/migrate.js create NAME  Crea una migración SQL con timestamp
 *
 * La conexión se arma con DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME, que Docker
 * Compose inyecta en cada servicio. Las migraciones viven en database/migrations por
 * defecto.
 *
 * Este script se ejecuta siempre dentro de Docker Compose. El servicio `migrate`
 * monta database/ con escritura, así que sirve tanto para aplicar migraciones como
 * para crear archivos nuevos.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

require('dotenv').config({ quiet: true });

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR
    ? path.resolve(process.env.MIGRATIONS_DIR)
    : path.resolve(__dirname, '../../database/migrations');

const MIGRATIONS_TABLE = process.env.MIGRATIONS_TABLE || 'pgmigrations';
// node-pg-migrate intenta cargar todos los archivos de la carpeta. Este patrón
// hace que solo se lean migraciones .sql y se ignoren README, .gitkeep, etc.
const SQL_ONLY_PATTERN = String.raw`(?!.*\.[sS][qQ][lL]$).*`;
const CLI_PATH = path.resolve(
    __dirname,
    '../node_modules/node-pg-migrate/bin/node-pg-migrate.js'
);

const command = (process.argv[2] || 'up').toLowerCase();
const forwardedArgs = process.argv.slice(3);

function buildDatabaseUrl() {
    const user = encodeURIComponent(process.env.DB_USER || 'postgres');
    const password = encodeURIComponent(process.env.DB_PASSWORD || 'postgres');
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const database = encodeURIComponent(process.env.DB_NAME || 'repusense_db');

    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

function runCli(cliArgs) {
    const result = spawnSync(process.execPath, [CLI_PATH, ...cliArgs], {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: buildDatabaseUrl(),
        },
    });

    if (result.error) {
        console.error('No se pudo ejecutar node-pg-migrate:', result.error.message);
        process.exitCode = 1;
        return;
    }

    if (result.signal) {
        console.error(`node-pg-migrate terminó por la señal ${result.signal}`);
        process.exitCode = 1;
        return;
    }

    process.exitCode = result.status ?? 1;
}

function runMigrations(direction) {
    const args = [
        direction,
        ...forwardedArgs,
        '--migrations-dir',
        MIGRATIONS_DIR,
        '--migrations-table',
        MIGRATIONS_TABLE,
        '--ignore-pattern',
        SQL_ONLY_PATTERN,
        '--advisory-lock-mode',
        'wait',
    ];

    // Cada migración en su propia transacción. En redo se mantiene la
    // transacción compartida para que down + up sea atómico.
    if (direction !== 'redo') {
        args.push('--no-single-transaction');
    }

    if (process.env.MIGRATION_VERBOSE !== 'true') {
        args.push('--no-verbose');
    }

    runCli(args);
}

function createMigration(name) {
    if (!name) {
        console.error(
            'Uso: docker compose run --rm migrate npm run migrate:create -- nombre_de_la_migracion'
        );
        process.exitCode = 1;
        return;
    }

    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });

    runCli([
        'create',
        name,
        '--migrations-dir',
        MIGRATIONS_DIR,
        '--ignore-pattern',
        SQL_ONLY_PATTERN,
        '--migration-file-language',
        'sql',
    ]);
}

function formatRunOn(value) {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

async function showStatus() {
    const client = new Client({ connectionString: buildDatabaseUrl() });
    await client.connect();

    try {
        const tableCheck = await client.query(
            `SELECT 1
               FROM information_schema.tables
              WHERE table_schema = 'public'
                AND table_name = $1`,
            [MIGRATIONS_TABLE]
        );

        let applied = [];
        if (tableCheck.rowCount > 0) {
            const result = await client.query(
                `SELECT name, run_on
                   FROM public."${MIGRATIONS_TABLE}"
                  ORDER BY id`
            );
            applied = result.rows;
        }

        const files = fs.existsSync(MIGRATIONS_DIR)
            ? fs
                  .readdirSync(MIGRATIONS_DIR)
                  .filter((file) => /\.sql$/i.test(file) && !file.startsWith('.'))
                  .sort()
            : [];

        const fileNames = files.map((file) => file.replace(/\.sql$/i, ''));
        const appliedByName = new Map(applied.map((row) => [row.name, row.run_on]));

        const rows = fileNames.map((name) => ({
            name,
            status: appliedByName.has(name) ? 'applied' : 'pending',
            runOn: appliedByName.get(name) || null,
        }));

        for (const row of applied) {
            if (!fileNames.includes(row.name)) {
                rows.push({
                    name: row.name,
                    status: 'missing',
                    runOn: row.run_on,
                });
            }
        }

        if (rows.length === 0) {
            console.log('No hay migraciones registradas ni pendientes.');
            return;
        }

        const statusWidth = Math.max(8, ...rows.map((row) => row.status.length));
        const nameWidth = Math.max(9, ...rows.map((row) => row.name.length));

        console.log(
            `${'Estado'.padEnd(statusWidth)}  ${'Migración'.padEnd(nameWidth)}  Aplicada el`
        );

        for (const row of rows) {
            console.log(
                `${row.status.padEnd(statusWidth)}  ${row.name.padEnd(nameWidth)}  ${formatRunOn(row.runOn)}`
            );
        }
    } finally {
        await client.end();
    }
}

async function main() {
    switch (command) {
        case 'up':
        case 'down':
        case 'redo':
            runMigrations(command);
            break;

        case 'create':
            createMigration(forwardedArgs[0]);
            break;

        case 'status':
            await showStatus();
            break;

        default:
            console.error(`Comando desconocido: ${command}`);
            console.error('Comandos disponibles: up, down, redo, status, create');
            process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error('Error de migraciones:', error.message);
    if (process.env.MIGRATION_DEBUG === 'true') {
        console.error(error.stack);
    }
    process.exitCode = 1;
});
