import { Card } from "@/components/ui/card"
import { Search, Calendar, Users } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Tour Search & Filtering",
    description:
      "Easily find your ideal tour with advanced search and filtering options by destination, price, duration, and more.",
  },
  {
    icon: Calendar,
    title: "Personal Tour Scheduling",
    description:
      "Plan your trips effortlessly with our intuitive scheduling system and personalized itinerary management.",
  },
  {
    icon: Users,
    title: "Tour & User Management",
    description: "Comprehensive administrative tools to manage tours, bookings, and user accounts all in one place.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-white">Powerful Features</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto text-pretty">
            Everything you need to discover, plan, and manage unforgettable travel experiences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow bg-slate-900/50 backdrop-blur-sm border-slate-700/50"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-slate-300 text-pretty">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
