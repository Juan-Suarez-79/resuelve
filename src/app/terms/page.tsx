import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-24">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Link href="/" className="inline-flex items-center text-gray-500 mb-6 hover:text-brand-red transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Volver al Inicio
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones de Uso</h1>

                <div className="prose prose-red max-w-none text-gray-600 space-y-6">
                    <p><strong>Última actualización: {new Date().toLocaleDateString()}</strong></p>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">1. DEFINICIÓN DEL SERVICIO Y NATURALEZA DE LA INTERMEDIACIÓN</h3>
                        <p className="mb-2">
                            "Resuelve" (en adelante, "La Plataforma") es una herramienta tecnológica de gestión de inventario y catálogo digital (SaaS).
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="font-bold mb-2 text-gray-900">CLÁUSULA DE NO-PARTICIPACIÓN:</p>
                            <p className="mb-2">El usuario reconoce y acepta que La Plataforma actúa exclusivamente como proveedor de software. "Resuelve":</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>NO</strong> es una tienda ni comercializa productos propios.</li>
                                <li><strong>NO</strong> procesa pagos ni recibe dinero de las transacciones entre usuarios.</li>
                                <li><strong>NO</strong> realiza servicios de entrega o logística.</li>
                                <li><strong>NO</strong> es responsable de la calidad, seguridad o legalidad de los artículos anunciados.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">2. POLÍTICA DE PRECIOS Y TASA DE CAMBIO (PROTECCIÓN CAMBIARIA)</h3>
                        <p className="mb-2">
                            La Plataforma ofrece una funcionalidad de calculadora para estimar precios en Bolívares (Bs) a partir de un precio base en Dólares (USD).
                        </p>
                        <p className="mb-2">
                            <strong>Responsabilidad del Usuario:</strong> La tasa de cambio utilizada para dicho cálculo es configurada manual y exclusivamente por EL VENDEDOR. La Plataforma no fija, sugiere ni impone tasas de cambio.
                        </p>
                        <p>
                            <strong>Cumplimiento Normativo:</strong> Es responsabilidad exclusiva del Vendedor cumplir con las normativas del Banco Central de Venezuela (BCV) y la Ley de Precios Justos al momento de concretar el cobro. La Plataforma se deslinda de cualquier infracción cometida por el usuario en materia de especulación o usura.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">3. RESPONSABILIDAD FISCAL Y TRIBUTARIA (PROTECCIÓN SENIAT)</h3>
                        <p className="mb-2">La Plataforma no es un agente de retención ni fiscalización.</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>El Vendedor es el único responsable de emitir la factura fiscal correspondiente, declarar el IVA y cumplir con todas las obligaciones tributarias ante el SENIAT derivadas de sus ventas.</li>
                            <li>"Resuelve" no forma parte de la relación tributaria generada por la compra-venta.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">4. USO PROHIBIDO Y PREVENCIÓN DE LEGITIMACIÓN DE CAPITALES</h3>
                        <p className="mb-2">Queda terminantemente prohibido utilizar La Plataforma para ofrecer, solicitar o comercializar:</p>
                        <ul className="list-disc pl-5 space-y-1 mb-4">
                            <li>Sustancias estupefacientes o psicotrópicas (Drogas).</li>
                            <li>Armas de fuego, municiones o explosivos.</li>
                            <li>Medicamentos que requieran récipe médico (sin la debida autorización legal).</li>
                            <li>Contenido pornográfico o de explotación sexual.</li>
                            <li>Cualquier bien de procedencia ilícita.</li>
                        </ul>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800">
                            <p><strong>DERECHO DE BLOQUEO:</strong> "Resuelve" se reserva el derecho de suspender inmediatamente y sin previo aviso cualquier cuenta que muestre comportamientos sospechosos de fraude, lavado de dinero o venta de artículos ilícitos, y colaborará con las autoridades competentes suministrando la información necesaria si es requerida bajo orden judicial.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">5. TRANSACCIONES Y PAGOS</h3>
                        <p>
                            Todos los pagos se acuerdan y ejecutan fuera de La Plataforma (vía Pago Móvil, Zelle, Efectivo, etc.) y bajo el acuerdo privado entre Vendedor y Comprador. "Resuelve" no tiene control sobre los fondos y no será responsable por pagos no recibidos, estafas entre usuarios o disputas por devoluciones.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">6. DATOS Y PRIVACIDAD</h3>
                        <p>
                            Al utilizar el servicio, el usuario acepta nuestra Política de Privacidad. La Plataforma utiliza la geolocalización únicamente para conectar oferta y demanda local. Los datos de registro de los Vendedores deben ser veraces; el uso de identidades falsas será causal de eliminación de la cuenta.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">7. LIMITACIÓN DE RESPONSABILIDAD</h3>
                        <p>
                            El uso de La Plataforma es bajo el propio riesgo del usuario. No garantizamos que el servicio sea ininterrumpido o libre de errores. En la máxima medida permitida por la ley venezolana, "Resuelve" no será responsable por daños directos, indirectos o lucro cesante derivados del uso o la imposibilidad de uso del servicio.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
