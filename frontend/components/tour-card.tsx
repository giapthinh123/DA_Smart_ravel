"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign } from "lucide-react"
import { useTranslations } from "next-intl"

interface Tour {
  id: number
  tourName: string
  location: string
  duration: string
  price: number
  image: string
  status: "Available" | "Full"
}

interface TourCardProps {
  tour: Tour
}

export function TourCard({ tour }: TourCardProps) {
  const t = useTranslations("TourCard")

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={tour.image || "/placeholder.svg"}
          alt={tour.tourName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge
          variant={tour.status === "Available" ? "default" : "secondary"}
          className="absolute top-3 right-3"
        >
          {tour.status === "Available" ? t("available") : t("full")}
        </Badge>
      </div>

      <CardContent className="p-5">
        <h3 className="font-semibold text-xl mb-3 text-balance">{tour.tourName}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{tour.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{tour.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">${tour.price}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link href={`/tours/${tour.id}`} className="w-full">
          <Button className="w-full" disabled={tour.status === "Full"}>
            {tour.status === "Available" ? t("viewDetails") : t("fullyBooked")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
