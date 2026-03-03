import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Quote, CheckCircle2, Phone } from "lucide-react"
import { useTranslations } from "next-intl"

const testimonials = [
  {
    id: 1,
    quote: "The personalized itinerary saved us hours of planning. Every recommendation was spot-on!",
    name: "Sarah Johnson",
    location: "New York, USA",
  },
  {
    id: 2,
    quote: "Amazing experience from start to finish. The local insights made our trip unforgettable.",
    name: "Michael Chen",
    location: "Singapore",
  },
  {
    id: 3,
    quote: "Best travel planning platform I've used. The AI suggestions were incredibly accurate.",
    name: "Emma Rodriguez",
    location: "Barcelona, Spain",
  },
]

export function CommunitySection() {
  const t = useTranslations("Dashboard.Community")

  const steps = [
    {
      number: "1",
      title: t("s1Title"),
      description: t("s1Desc"),
    },
    {
      number: "2",
      title: t("s2Title"),
      description: t("s2Desc"),
    },
    {
      number: "3",
      title: t("s3Title"),
      description: t("s3Desc"),
    },
  ]

  return (
    <section id="stories" className="py-20 md:py-32 bg-gradient-to-b from-blue-950/30 to-transparent">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Testimonials */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
                {t("title")}
              </h2>
              <p className="text-lg text-gray-300">{t("subtitle")}</p>
            </div>

            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:bg-white/10 transition-all"
                >
                  <Quote className="h-8 w-8 text-cyan-400 mb-4" />
                  <p className="text-gray-200 mb-4 leading-relaxed">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.location}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column - Journey Steps & Consultation */}
          <div className="space-y-8">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
              <h3 className="text-3xl font-bold text-white mb-6">{t("stepTitle")}</h3>
              <div className="space-y-6">
                {steps.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xl">
                        {step.number}
                      </div>
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                      <p className="text-gray-400 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border-cyan-500/30 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-cyan-500/20">
                  <Phone className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{t("consultationTitle")}</h3>
                  <p className="text-gray-200">
                    {t("consultationDesc")}
                  </p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  <span>{t("consultationPoint1")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  <span>{t("consultationPoint2")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  <span>{t("consultationPoint3")}</span>
                </div>
              </div>
              <Button size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                {t("bookSession")}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
