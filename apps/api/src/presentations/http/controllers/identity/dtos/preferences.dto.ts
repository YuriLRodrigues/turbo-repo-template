import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsString, MaxLength, ValidateNested } from 'class-validator'

import { accents, densities, themeChoices } from '@domain/identity/enterprise/preferences/appearance'
import {
  type OnboardingStatus,
  onboardingStatuses,
  type OnboardingStep,
  onboardingSteps,
} from '@domain/identity/enterprise/preferences/onboarding'

import { Sent } from '../../../validation/dto-decorators'

// ── Response ────────────────────────────────────────────────────────────────────────────────────────────────

export class AppearanceDto {
  @ApiProperty({ enum: themeChoices, example: 'system' })
  theme: string

  @ApiProperty({ enum: accents, example: 'neutral' })
  accent: string

  @ApiProperty({ enum: densities, example: 'comfortable' })
  density: string

  @ApiProperty({ example: false, description: 'Transitions end at once and nothing loops.' })
  reduceMotion: boolean
}

export class OnboardingDto {
  @ApiProperty({
    enum: onboardingStatuses,
    example: 'pending',
    description: '`pending` shows the "continue setup" card; `finished` and `dismissed` hide it.',
  })
  status: OnboardingStatus

  @ApiProperty({ enum: onboardingSteps, example: 'profile', description: 'Where to resume.' })
  currentStep: OnboardingStep

  @ApiProperty({ enum: onboardingSteps, isArray: true, example: ['welcome'] })
  completedSteps: OnboardingStep[]

  @ApiProperty({ enum: onboardingSteps, isArray: true, example: [] })
  skippedSteps: OnboardingStep[]
}

export class PreferencesResponseDto {
  @ApiProperty({ type: AppearanceDto })
  appearance: AppearanceDto

  @ApiProperty({ example: 'UTC', description: 'IANA name. "Today" and the month follow it.' })
  timeZone: string

  @ApiProperty({ type: OnboardingDto })
  onboarding: OnboardingDto

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Null while the person still has the defaults.',
  })
  updatedAt: string | null
}

// ── Request ─────────────────────────────────────────────────────────────────────────────────────────────────

export class AppearanceChangesDto {
  @ApiPropertyOptional({ enum: themeChoices })
  @Sent()
  @IsString()
  @MaxLength(40)
  theme?: string

  @ApiPropertyOptional({ enum: accents })
  @Sent()
  @IsString()
  @MaxLength(40)
  accent?: string

  @ApiPropertyOptional({ enum: densities })
  @Sent()
  @IsString()
  @MaxLength(40)
  density?: string

  @ApiPropertyOptional({ example: true })
  @Sent()
  @IsBoolean()
  reduceMotion?: boolean
}

export class OnboardingChangesDto {
  @ApiPropertyOptional({ enum: onboardingStatuses })
  @Sent()
  @IsString()
  @MaxLength(40)
  status?: string

  @ApiPropertyOptional({ enum: onboardingSteps })
  @Sent()
  @IsString()
  @MaxLength(40)
  currentStep?: string

  @ApiPropertyOptional({ enum: onboardingSteps, isArray: true })
  @Sent()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  completedSteps?: string[]

  @ApiPropertyOptional({ enum: onboardingSteps, isArray: true })
  @Sent()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  skippedSteps?: string[]
}

/** Only what is sent changes, at every level: `{ "appearance": { "theme": "dark" } }` keeps the accent. */
export class UpdatePreferencesDto {
  @ApiPropertyOptional({ type: AppearanceChangesDto })
  @Sent()
  @ValidateNested()
  @Type(() => AppearanceChangesDto)
  appearance?: AppearanceChangesDto

  @ApiPropertyOptional({ example: 'Europe/Lisbon' })
  @Sent()
  @IsString()
  @MaxLength(100)
  timeZone?: string

  @ApiPropertyOptional({ type: OnboardingChangesDto })
  @Sent()
  @ValidateNested()
  @Type(() => OnboardingChangesDto)
  onboarding?: OnboardingChangesDto
}
