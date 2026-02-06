"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

const cities = [
  { value: "new-york", label: "New York, USA", country: "USA" },
  { value: "london", label: "London, UK", country: "UK" },
  { value: "paris", label: "Paris, France", country: "France" },
  { value: "tokyo", label: "Tokyo, Japan", country: "Japan" },
  { value: "dubai", label: "Dubai, UAE", country: "UAE" },
  { value: "singapore", label: "Singapore", country: "Singapore" },
  { value: "bali", label: "Bali, Indonesia", country: "Indonesia" },
  { value: "sydney", label: "Sydney, Australia", country: "Australia" },
  { value: "rome", label: "Rome, Italy", country: "Italy" },
  { value: "barcelona", label: "Barcelona, Spain", country: "Spain" },
  { value: "santorini", label: "Santorini, Greece", country: "Greece" },
  { value: "maldives", label: "Maldives", country: "Maldives" },
  { value: "phuket", label: "Phuket, Thailand", country: "Thailand" },
  { value: "istanbul", label: "Istanbul, Turkey", country: "Turkey" },
  { value: "bangkok", label: "Bangkok, Thailand", country: "Thailand" },
]

type CitySearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CitySearch({ value, onChange, placeholder = "Select a city" }: CitySearchProps) {
  const [open, setOpen] = useState(false)

  const selectedCity = cities.find((city) => city.label === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-transparent"
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {selectedCity ? selectedCity.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search cities..." />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {cities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.label}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === city.label ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{city.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
