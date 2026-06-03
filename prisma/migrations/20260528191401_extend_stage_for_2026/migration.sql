-- WC 2026 requires 12 groups (A through L) instead of the 2022 8-group format.
-- This migration adds GROUP_I through GROUP_L to the Stage enum.

ALTER TYPE "Stage" ADD VALUE 'GROUP_I' AFTER 'GROUP_H';
ALTER TYPE "Stage" ADD VALUE 'GROUP_J' AFTER 'GROUP_I';
ALTER TYPE "Stage" ADD VALUE 'GROUP_K' AFTER 'GROUP_J';
ALTER TYPE "Stage" ADD VALUE 'GROUP_L' AFTER 'GROUP_K';
