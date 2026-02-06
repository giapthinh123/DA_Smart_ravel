import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-blue-600/90">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-white">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-8 text-white/90 text-pretty">
            Join thousands of travelers who have discovered their perfect adventure with us. Create your account today
            and unlock exclusive tour deals and personalized recommendations.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-base">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
