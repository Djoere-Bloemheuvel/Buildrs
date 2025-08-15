
import { Badge } from '@/components/ui/badge'

interface IndustryBadgesProps {
  industryLabel?: string
  subindustryLabel?: string
  className?: string
}

export function IndustryBadges({ industryLabel, subindustryLabel, className }: IndustryBadgesProps) {
  if (!industryLabel && !subindustryLabel) {
    return null
  }

  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground mb-2">Industrie</p>
      <div className="flex flex-wrap gap-1">
        {industryLabel && (
          <Badge variant="secondary" className="text-xs">
            {industryLabel}
          </Badge>
        )}
        {subindustryLabel && (
          <Badge variant="outline" className="text-xs">
            {subindustryLabel}
          </Badge>
        )}
      </div>
    </div>
  )
}
