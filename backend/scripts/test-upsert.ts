import { guardarLead } from "../services/lead.service";

async function probarGuardarLead() {
    try {
        const datos = {
            place_id: "test-guardar-lead-001",
            nombre: "Negocio de prueba",
            pais: "Argentina",
            ciudad: "Neuquen",
            rubro: "Restaurante",
            rating: 3.2,
            review_count: 10,
        };

        const resultado = await guardarLead(datos);

        console.log("Resultado:", resultado);
    } catch (error) {
        console.error("Error al guardar el lead:", error);
    }
}

probarGuardarLead();