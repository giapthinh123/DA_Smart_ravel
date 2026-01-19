"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, X, ChevronDown, ChevronUp, MapPin, Calendar, Users, DollarSign } from "lucide-react"
import type { TripDetails, PreferenceItem } from "@/app/schedule/build/page"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type PreferencesStepProps = {
  tripDetails: TripDetails
  onComplete: (preferences: PreferenceItem[]) => void
  onBack: () => void
  initialPreferences: PreferenceItem[]
}

// Dummy preference data
const dummyPreferences: PreferenceItem[] = [
  // Restaurants
  {
    id: "r1",
    name: "Seaside Grill",
    image: "/seaside-restaurant.jpg",
    price: 45,
    rating: 4.5,
    category: "Restaurants",
  },
  {
    id: "r2",
    name: "Mountain View Cafe",
    image: "/mountain-cafe.png",
    price: 30,
    rating: 4.3,
    category: "Restaurants",
  },
  {
    id: "r3",
    name: "City Bistro",
    image: "/city-bistro.jpg",
    price: 55,
    rating: 4.7,
    category: "Restaurants",
  },
  // Hotels
  {
    id: "h1",
    name: "Grand Hotel Plaza",
    image: "/luxury-hotel-lobby.png",
    price: 250,
    rating: 4.8,
    category: "Hotels",
  },
  {
    id: "h2",
    name: "Boutique Inn",
    image: "/boutique-hotel-room.png",
    price: 180,
    rating: 4.6,
    category: "Hotels",
  },
  {
    id: "h3",
    name: "Coastal Resort",
    image: "/tropical-beach-resort.png",
    price: 320,
    rating: 4.9,
    category: "Hotels",
  },
  // Recreation
  {
    id: "rc1",
    name: "National Park Tour",
    image: "/national-park.jpg",
    price: 35,
    rating: 4.7,
    category: "Recreation",
  },
  {
    id: "rc2",
    name: "Museum Visit",
    image: "/art-museum-interior.png",
    price: 20,
    rating: 4.4,
    category: "Recreation",
  },
  {
    id: "rc3",
    name: "Water Sports",
    image: "/water-sports.jpg",
    price: 65,
    rating: 4.6,
    category: "Recreation",
  },
  // Transport
  {
    id: "t1",
    name: "Private Car Rental",
    image: "/rental-car.png",
    price: 80,
    rating: 4.5,
    category: "Transport",
  },
  {
    id: "t2",
    name: "City Metro Pass",
    image: "/metro-train.jpg",
    price: 15,
    rating: 4.2,
    category: "Transport",
  },
  {
    id: "t3",
    name: "Bicycle Rental",
    image: "/bicycle-rental-shop.png",
    price: 25,
    rating: 4.4,
    category: "Transport",
  },
]

export function PreferencesStep({ tripDetails, onComplete, onBack, initialPreferences }: PreferencesStepProps) {
  const [preferences, setPreferences] = useState<PreferenceItem[]>(
    initialPreferences.length > 0
      ? initialPreferences
      : dummyPreferences.map((p) => ({ ...p, liked: false, skipped: false })),
  )
  const [currentDay, setCurrentDay] = useState(1)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Restaurants", "Hotels"])

  const totalDays = Math.ceil(
    (new Date(tripDetails.endDate).getTime() - new Date(tripDetails.startDate).getTime()) / (1000 * 60 * 60 * 24),
  )

  const categories = ["Restaurants", "Hotels", "Recreation", "Transport"]

  const handleLike = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, skipped: p.liked ? p.skipped : false } : p)),
    )
  }

  const handleSkip = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, skipped: !p.skipped, liked: p.skipped ? p.liked : false } : p)),
    )
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleContinue = () => {
    onComplete(preferences)
  }

  const totalGuests =
    Number(tripDetails.adults || 0) + Number(tripDetails.children || 0) + Number(tripDetails.infants || 0)

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Trip Overview */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Trip Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">{tripDetails.destination}</p>
                  <p className="text-xs text-muted-foreground">From {tripDetails.departure}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Dates</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tripDetails.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(tripDetails.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{totalDays} days</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Guests</p>
                  <p className="text-sm text-muted-foreground">{totalGuests} total</p>
                  <p className="text-xs text-muted-foreground">
                    {tripDetails.adults} adults{tripDetails.children ? `, ${tripDetails.children} children` : ""}
                    {tripDetails.infants ? `, ${tripDetails.infants} infants` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-sm text-muted-foreground">${tripDetails.budget} per person</p>
                </div>
              </div>
            </div>

            {/* Day Progress */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Planning Progress</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalDays }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentDay === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentDay(i + 1)}
                    className="flex-1"
                  >
                    Day {i + 1}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Preference Selection */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Curate Your Preferences</CardTitle>
            <p className="text-muted-foreground">
              Like your favorites and skip what you don't want for Day {currentDay}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((category) => {
              const categoryItems = preferences.filter((p) => p.category === category)
              const isExpanded = expandedCategories.includes(category)

              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <div className="space-y-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                        <h3 className="text-lg font-semibold">{category}</h3>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {categoryItems.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <div className="relative h-40">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <CardContent className="p-4 space-y-3">
                              <div>
                                <h4 className="font-semibold text-balance">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    ${item.price}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">★ {item.rating}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant={item.liked ? "default" : "outline"}
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleLike(item.id)}
                                >
                                  <Heart className={`h-4 w-4 mr-1 ${item.liked ? "fill-current" : ""}`} />
                                  Like
                                </Button>
                                <Button
                                  variant={item.skipped ? "destructive" : "outline"}
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleSkip(item.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Skip
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onBack} className="flex-1 bg-transparent">
            Back to Previous Step
          </Button>
          <Button size="lg" onClick={handleContinue} className="flex-1">
            Continue to Build Schedule
          </Button>
        </div>
      </div>
    </div>
  )
}
