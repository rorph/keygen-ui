import { toast } from 'sonner'

/**
 * Copy text to clipboard with proper fallback for non-HTTPS contexts.
 * Shows a toast notification on success/failure.
 */
export async function copyToClipboard(text: string, label = 'Text'): Promise<boolean> {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
      return true
    }
  } catch {
    // navigator.clipboard may throw in non-secure contexts - fall through to fallback
  }

  // Fallback: use a temporary textarea element
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (success) {
      toast.success(`${label} copied to clipboard`)
      return true
    }
  } catch {
    // Fallback also failed
  }

  toast.error(`Failed to copy ${label.toLowerCase()} to clipboard`)
  return false
}
