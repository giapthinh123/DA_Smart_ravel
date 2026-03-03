import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useTranslations } from "next-intl"

export function ItinerariesCatalog() {
  const t = useTranslations("Dashboard.Catalog")

  const itineraries = [
    {
      id: 1,
      destination: t("d1Title"),
      description: t("d1Desc"),
      duration: t("d1Dur"),
      price: "$1,299",
      image: "/bali-beach-paradise.jpg",
    },
    {
      id: 2,
      destination: t("d2Title"),
      description: t("d2Desc"),
      duration: t("d2Dur"),
      price: "$2,899",
      image: "/europe-historic-cities.jpg",
    },
    {
      id: 3,
      destination: t("d3Title"),
      description: t("d3Desc"),
      duration: t("d3Dur"),
      price: "$2,199",
      image: "/japan-cherry-blossom.jpg",
    },
  ]

  return (
    <section id="featured" className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto text-balance">
            {t("description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {itineraries.map((itinerary) => (
            <Card
              key={itinerary.id}
              className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden hover:scale-105 transition-transform group cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={itinerary.image || "/placeholder.svg"}
                  alt={itinerary.destination}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {itinerary.destination}
                </h3>
                <p className="text-gray-300">{itinerary.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{itinerary.duration}</span>
                  </div>
                  <div className="text-xl font-bold text-cyan-400">{itinerary.price}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
            {t("consultation")}
          </Button>
        </div>
      </div>
    </section>
  )
}
