import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

const itineraries = [
  {
    id: 1,
    destination: "Bali Island Paradise",
    description: "Experience tropical beaches, ancient temples, and vibrant culture",
    duration: "8 days",
    price: "$1,299",
    image: "/bali-beach-paradise.jpg",
  },
  {
    id: 2,
    destination: "European Heritage Tour",
    description: "Discover the art, architecture, and history of Europe's finest cities",
    duration: "12 days",
    price: "$2,899",
    image: "/europe-historic-cities.jpg",
  },
  {
    id: 3,
    destination: "Japan Cherry Blossom",
    description: "Witness stunning sakura season and explore traditional Japanese culture",
    duration: "10 days",
    price: "$2,199",
    image: "/japan-cherry-blossom.jpg",
  },
]

export function ItinerariesCatalog() {
  return (
    <section id="featured" className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Personalized itinerary catalog based on your goals
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto text-balance">
            Carefully curated journeys designed to match your travel dreams
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
            Get a free consultation
          </Button>
        </div>
      </div>
    </section>
  )
}
