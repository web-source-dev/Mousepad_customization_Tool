"use client"

import React, { useRef, useEffect } from 'react'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'
import { Plus, ChevronUp } from 'lucide-react'

export interface DropdownOption {
  id: string
  label: string
  value: string
  description?: string
  icon?: React.ReactNode
  badge?: string
  price?: string
}

interface DropdownSelectorProps {
  options: DropdownOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DropdownSelector({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  className
}: DropdownSelectorProps) {
  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option, index) => (
        <Card 
          key={option.id}
          className={cn(
            "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
            value === option.value 
              ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-l-blue-500 shadow-sm" 
              : "hover:bg-gradient-to-r hover:from-white hover:to-gray-50"
          )}
          onClick={() => onValueChange(option.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onValueChange(option.value)
            }
          }}
          tabIndex={0}
          role="button"
          aria-pressed={value === option.value}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200",
                  value === option.value 
                    ? "border-blue-500 bg-blue-500" 
                    : "border-gray-300 bg-white group-hover:border-gray-400"
                )}>
                  {value === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {option.icon && (
                      <div className="flex-shrink-0">
                        {option.icon}
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 truncate">
                      {option.label}
                    </span>
                    {option.badge && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
              {option.price && (
                <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded font-medium text-sm">
                  {option.price}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ExpandableDropdownSelectorProps {
  title: string
  options: DropdownOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  isExpanded?: boolean
  onToggle?: () => void
  autoCloseOthers?: boolean
  children?: React.ReactNode
  inlineChildren?: Record<string, React.ReactNode> // New prop for inline children
}

export function ExpandableDropdownSelector({
  title,
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  className,
  isExpanded = false,
  onToggle,
  autoCloseOthers = true,
  children,
  inlineChildren
}: ExpandableDropdownSelectorProps) {
  const selectedOption = options.find(option => option.value === value)
  const cardRef = useRef<HTMLDivElement>(null)

  // Add focus management
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const firstOption = cardRef.current.querySelector('[role="button"]') as HTMLElement
      if (firstOption) {
        firstOption.focus()
      }
    }
  }, [isExpanded])

  return (
    <div className={cn("relative", className)} ref={cardRef}>
      {/* Compact dropdown container */}
      <Card className={cn(
        "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200",
        isExpanded && "border-black-500 shadow-md"
      )}>
        <CardContent className="p-0">
          <div
            className={cn(
              "flex items-center justify-between p-3 cursor-pointer transition-all duration-200 group",
              isExpanded 
                ? "bg-[#f9fafb] border-b border-black-200" 
                : "hover:bg-gray-50"
            )}
            onClick={onToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle?.()
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={isExpanded}
            aria-haspopup="listbox"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center">
                <span className={cn(
                  "text-sm font-semibold",
                  isExpanded 
                    ? "text-blue-700" 
                    : "text-gray-600"
                )}>
                  {title.split('.')[0]}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    isExpanded 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {title.split('.')[1]?.trim()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm truncate",
                    isExpanded ? "text-blue-900" : "text-gray-900"
                  )}>
                    {selectedOption ? selectedOption.label : placeholder}
                  </span>
                  {selectedOption?.badge && (
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded",
                      isExpanded 
                        ? "bg-blue-200 text-blue-800" 
                        : "bg-gray-200 text-gray-700"
                    )}>
                      {selectedOption.badge}
                    </span>
                  )}
                </div>
                {selectedOption?.description && (
                  <p className={cn(
                    "text-xs mt-1 leading-relaxed",
                    isExpanded ? "text-blue-700" : "text-gray-600"
                  )}>
                    {selectedOption.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              isExpanded 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
            )}>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </div>
          </div>
          
          {/* Compact dropdown elements */}
          {isExpanded && (
            <div 
              className="bg-white"
              role="listbox"
              aria-label={`${title} options`}
            >
              {options.map((option, index) => (
                <div key={option.id}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer transition-all duration-200 group",
                      value === option.value 
                        ? "bg-blue-50 border-l-2 border-l-blue-500" 
                        : "hover:bg-gray-50",
                      index !== options.length - 1 && "border-b border-gray-100"
                    )}
                    onClick={() => onValueChange(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onValueChange(option.value)
                      }
                    }}
                    tabIndex={0}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all duration-200",
                        value === option.value 
                          ? "border-blue-500 bg-blue-500" 
                          : "border-gray-300 bg-white group-hover:border-gray-400"
                      )}>
                        {value === option.value && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <div className="flex-shrink-0">
                              {option.icon}
                            </div>
                          )}
                          <span className={cn(
                            "font-medium text-sm truncate",
                            value === option.value ? "text-blue-900" : "text-gray-900"
                          )}>
                            {option.label}
                          </span>
                          {option.badge && (
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded",
                              value === option.value 
                                ? "bg-blue-200 text-blue-800" 
                                : "bg-gray-200 text-gray-700"
                            )}>
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className={cn(
                            "text-xs mt-1 leading-relaxed",
                            value === option.value ? "text-blue-700" : "text-gray-600"
                          )}>
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {option.price && (
                      <div className={cn(
                        "px-2 py-1 text-xs font-medium rounded",
                        value === option.value 
                          ? "bg-blue-200 text-blue-800" 
                          : "bg-gray-200 text-gray-700"
                      )}>
                        {option.price}
                      </div>
                    )}
                  </div>
                  
                  {/* Inline children content for this specific option */}
                  {inlineChildren && inlineChildren[option.value] && value === option.value && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      {inlineChildren[option.value]}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Custom children content */}
              {children && (
                <div className="border-t border-gray-100">
                  {children}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}