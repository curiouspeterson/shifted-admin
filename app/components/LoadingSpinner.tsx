/**
 * Loading Spinner Component
 * Last Updated: 2024
 * 
 * A simple, reusable loading indicator component that displays
 * an animated spinning circle. Uses Tailwind CSS for styling
 * and animations.
 * 
 * Features:
 * - Centered layout
 * - Smooth spinning animation
 * - Consistent sizing
 * - Indigo color scheme matching app theme
 */

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      {/* 
        Spinner Element
        - Uses border trick to create circular spinner
        - Tailwind's animate-spin for rotation
        - Partial borders to create spinning effect
        - Consistent 8x8 (2rem) size
      */}
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  )
} 