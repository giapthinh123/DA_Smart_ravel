import { Card } from "@/components/ui/card"
import { Plane, MapPin, Calendar, Users } from "lucide-react"

const features = [
  {
    icon: Plane,
    title: "Flight Ticket Integration",
    description: "Seamless booking integration with major airlines for the best fares and convenient scheduling.",
  },
  {
    icon: MapPin,
    title: "Smart Location Suggestions",
    description: "AI-powered recommendations based on your interests, budget, and travel style preferences.",
  },
  {
    icon: Calendar,
    title: "Detailed Daily Itinerary",
    description: "Hour-by-hour planning with activities, dining, and transportation all organized for you.",
  },
  {
    icon: Users,
    title: "Budget & Group Sync",
    description: "Coordinate travel plans with friends and family while staying within your budget.",
  },
]

export function FeaturesGrid() {
  return (
    <section id="experiences" className="py-20 md:py-32 bg-gradient-to-b from-transparent to-blue-950/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Journey quality meticulously built at every stage
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto text-balance">
            Every detail matters when crafting your perfect travel experience
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:bg-white/10 transition-all group"
              >
                <div className="mb-4">
                  <div className="inline-flex p-3 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
