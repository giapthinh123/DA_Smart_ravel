import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

export function DashboardHero() {
  const t = useTranslations("Dashboard.Hero")

  const suggestedItineraries = [
    {
      id: 1,
      title: t("t1Title"),
      description: t("t1Desc"),
      duration: t("t1Dur"),
      image: "/vietnam-beach-coastline.jpg",
    },
    {
      id: 2,
      title: t("t2Title"),
      description: t("t2Desc"),
      duration: t("t2Dur"),
      image: "/mountain-trekking-scenery.jpg",
    },
    {
      id: 3,
      title: t("t3Title"),
      description: t("t3Desc"),
      duration: t("t3Dur"),
      image: "/city-culture-street.jpg",
    },
  ]

  return (
    <section className="relative py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30">
              {t("badge")}
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight text-balance">
              {t("title")}
            </h1>

            <p className="text-lg text-gray-300 text-balance leading-relaxed">
              {t("description")}
            </p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <div className="text-3xl font-bold text-cyan-400">1.2K+</div>
                <div className="text-sm text-gray-400 mt-1">{t("optimized")}</div>
              </Card>
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <div className="text-3xl font-bold text-cyan-400">98%</div>
                <div className="text-sm text-gray-400 mt-1">{t("satisfaction")}</div>
              </Card>
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <div className="text-3xl font-bold text-cyan-400">36</div>
                <div className="text-sm text-gray-400 mt-1">{t("countries")}</div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                {t("createProfile")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                {t("viewTours")}
              </Button>
            </div>
          </div>

          {/* Right Column - Suggested Itineraries */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-2xl font-bold text-white mb-6">{t("suggested")}</h3>
            <div className="space-y-4">
              {suggestedItineraries.map((itinerary) => (
                <Card
                  key={itinerary.id}
                  className="bg-white/5 backdrop-blur-xl border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex gap-4">
                    <img
                      src={itinerary.image || "/placeholder.svg"}
                      alt={itinerary.title}
                      className="w-24 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                        {itinerary.title}
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">{itinerary.description}</p>
                      <div className="flex items-center gap-1 text-xs text-cyan-400">
                        <Clock className="h-3 w-3" />
                        <span>{itinerary.duration}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
