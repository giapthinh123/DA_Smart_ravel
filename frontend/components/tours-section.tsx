import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign } from "lucide-react"
import Link from "next/link"

const tours = [
  {
    id: 1,
    name: "Tropical Paradise Escape",
    location: "Bali, Indonesia",
    price: 1299,
    image: "/tropical-beach-resort-bali.jpg",
  },
  {
    id: 2,
    name: "Alpine Adventure Trek",
    location: "Swiss Alps, Switzerland",
    price: 1899,
    image: "/swiss-alps-mountain-peaks.jpg",
  },
  {
    id: 3,
    name: "Ancient Wonders Tour",
    location: "Rome, Italy",
    price: 1599,
    image: "/roman-colosseum-at-sunset.jpg",
  },
  {
    id: 4,
    name: "Safari Expedition",
    location: "Serengeti, Tanzania",
    price: 2499,
    image: "/african-safari-wildlife-landscape.jpg",
  },
  {
    id: 5,
    name: "Northern Lights Adventure",
    location: "Reykjavik, Iceland",
    price: 1799,
    image: "/northern-lights-aurora-borealis-iceland.jpg",
  },
  {
    id: 6,
    name: "Coastal Discovery",
    location: "Amalfi Coast, Italy",
    price: 1699,
    image: "/amalfi-coast-colorful-coastal-town.jpg",
  },
]

export function ToursSection() {
  return (
    <section id="tours" className="py-16 md:py-24 bg-slate-900/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-white">Popular Tours</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto text-pretty">
            Explore our most sought-after destinations and experiences
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <Card
              key={tour.id}
              className="overflow-hidden hover:shadow-lg transition-shadow bg-slate-900/50 backdrop-blur-sm border-slate-700/50"
            >
              <div
                className="h-48 bg-muted"
                style={{
                  backgroundImage: `url(${tour.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-white">{tour.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{tour.location}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-lg">{tour.price}</span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href={`/tours/${tour.id}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
