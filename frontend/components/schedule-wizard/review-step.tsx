"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Calendar, Users, DollarSign, Check, Clock } from "lucide-react"
import type { TripDetails, PreferenceItem } from "@/app/schedule/build/page"

type ReviewStepProps = {
  tripDetails: TripDetails
  preferences: PreferenceItem[]
  onBack: () => void
}

type Activity = {
  time: string
  title: string
  cost: number
  category: string
}

export function ReviewStep({ tripDetails, preferences, onBack }: ReviewStepProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const totalDays = Math.ceil(
    (new Date(tripDetails.endDate).getTime() - new Date(tripDetails.startDate).getTime()) / (1000 * 60 * 60 * 24),
  )

  const totalGuests =
    Number(tripDetails.adults || 0) + Number(tripDetails.children || 0) + Number(tripDetails.infants || 0)

  // Generate dummy itinerary based on liked preferences
  const likedItems = preferences.filter((p) => p.liked)

  const generateDaySchedule = (day: number): Activity[] => {
    const activities: Activity[] = []
    const startDate = new Date(tripDetails.startDate)
    startDate.setDate(startDate.getDate() + day - 1)

    // Morning activity
    const recreation = likedItems.find((item) => item.category === "Recreation")
    if (recreation) {
      activities.push({
        time: "09:00 AM",
        title: recreation.name,
        cost: recreation.price,
        category: recreation.category,
      })
    }

    // Lunch
    const restaurant1 = likedItems.find((item) => item.category === "Restaurants")
    if (restaurant1) {
      activities.push({
        time: "12:30 PM",
        title: `Lunch at ${restaurant1.name}`,
        cost: restaurant1.price,
        category: restaurant1.category,
      })
    }

    // Afternoon transport
    const transport = likedItems.find((item) => item.category === "Transport")
    if (transport) {
      activities.push({
        time: "02:00 PM",
        title: transport.name,
        cost: transport.price,
        category: transport.category,
      })
    }

    // Dinner
    const restaurant2 = likedItems.filter((item) => item.category === "Restaurants")[1]
    if (restaurant2) {
      activities.push({
        time: "07:00 PM",
        title: `Dinner at ${restaurant2.name}`,
        cost: restaurant2.price,
        category: restaurant2.category,
      })
    }

    return activities
  }

  const daySchedules = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    date: new Date(new Date(tripDetails.startDate).getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    activities: generateDaySchedule(i + 1),
  }))

  // Calculate total cost
  const totalActivityCost = daySchedules.reduce(
    (sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0),
    0,
  )

  const hotelCostPerNight = likedItems.find((item) => item.category === "Hotels")?.price || 200
  const totalHotelCost = hotelCostPerNight * (totalDays - 1) // nights = days - 1

  const totalCost = totalActivityCost + totalHotelCost

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSaving(false)
    setShowSuccess(true)

    // Redirect after success
    setTimeout(() => {
      router.push("/schedule")
    }, 3000)
  }

  if (showSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Alert className="border-green-500 bg-green-50">
            <Check className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 text-base">
              Your personal tour has been saved successfully! You can view it in your schedule.
            </AlertDescription>
          </Alert>
          <div className="text-center mt-6 text-muted-foreground">
            <p>Redirecting to your schedule...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tour Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Tour Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destination</p>
                  <p className="font-semibold">{tripDetails.destination}</p>
                  <p className="text-sm text-muted-foreground">From {tripDetails.departure}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="font-semibold">{totalDays} days</p>
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
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Travelers</p>
                  <p className="font-semibold">{totalGuests} people</p>
                  <p className="text-sm text-muted-foreground">
                    {tripDetails.adults} adults{tripDetails.children ? `, ${tripDetails.children} children` : ""}
                    {tripDetails.infants ? `, ${tripDetails.infants} infants` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="font-semibold text-2xl text-primary">${totalCost}</p>
                  <p className="text-sm text-muted-foreground">${Math.round(totalCost / totalGuests)} per person</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day-by-Day Itinerary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Day-by-Day Itinerary</CardTitle>
          <p className="text-muted-foreground">Your personalized schedule based on your preferences</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {daySchedules.map((daySchedule) => (
            <div key={daySchedule.day} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <Badge variant="default" className="text-base px-3 py-1">
                  Day {daySchedule.day}
                </Badge>
                <span className="text-sm text-muted-foreground">{daySchedule.date}</span>
              </div>

              <div className="space-y-3 pl-6">
                {daySchedule.activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-3 border-b last:border-0">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{activity.time}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {activity.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">${activity.cost}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Day Total: </span>
                  <span className="font-semibold">${daySchedule.activities.reduce((sum, a) => sum + a.cost, 0)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Cost Breakdown */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Activities Total:</span>
              <span className="font-medium">${totalActivityCost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Accommodation ({totalDays - 1} {totalDays - 1 === 1 ? "night" : "nights"}):
              </span>
              <span className="font-medium">${totalHotelCost}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Grand Total:</span>
              <span className="text-primary">${totalCost}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1 bg-transparent" disabled={isSaving}>
          Back
        </Button>
        <Button size="lg" onClick={handleSave} className="flex-1" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save & Book Tour"}
        </Button>
      </div>
    </div>
  )
}
