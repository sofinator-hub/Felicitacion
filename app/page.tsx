
import LotusScene from "@/components/lotus-scene";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050810] text-white">

      {/* FLOR DE LOTO: FONDO FIJO */}
      <div className="fixed inset-0 z-0 h-screen w-full">
        <LotusScene />
      </div>

      {/* CONTENIDO CON SCROLL */}
      <div className="relative z-10 pointer-events-none">

        {/* SECCIÓN 1: PORTADA VISUAL */}
        <section className="relative min-h-screen" />

        {/* SECCIÓN 2: FELICITACIÓN */}
        <section className="relative min-h-screen flex items-center justify-center px-7 py-32">

          {/* DEGRADADO PARA LEGIBILIDAD */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(3,7,20,0.88)_0%,rgba(3,7,20,0.65)_38%,rgba(3,7,20,0.20)_70%,transparent_100%)]" />

          {/* TEXTO */}
          <div className="relative z-10 max-w-3xl mx-auto text-center">

            <p className="text-[10px] sm:text-xs tracking-[0.45em] uppercase text-[#AFC6F1] mb-10">
              Un día para celebrar tu existencia
            </p>

            <h2 className="text-4xl sm:text-5xl md:text-7xl font-light tracking-wide leading-tight mb-12">
              Feliz cumpleaños,
              <span className="block mt-3 text-[#AFC6F1] italic">
                amor.
              </span>
            </h2>

            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#AFC6F1] to-transparent mx-auto mb-12" />

            <p className="text-lg sm:text-xl md:text-2xl leading-[2] font-light text-white">
              Feliz cumpleaños amor, eres una persona maravillosa y única,
              no hay nadie como tú en todo el mundo y eres mi persona favorita,
              sigue soñando en grande, yo estaré a lado tuyo siempre,
              te amo con todo mi corazón guapo.
            </p>

            <div className="mt-16 text-[#AFC6F1] text-2xl">
              ✧
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
