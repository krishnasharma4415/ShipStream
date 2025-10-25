

export function useAnalytics() {
  const track = (event: string, properties?: Record<string, any>) => {
    // In a real app, you'd send this to your analytics service
    console.log('Analytics Event:', { event, properties, timestamp: new Date().toISOString() })
    
    // Store locally for demo purposes
    const events = JSON.parse(localStorage.getItem('analytics') || '[]')
    events.push({ event, properties, timestamp: new Date().toISOString() })
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100)
    }
    
    localStorage.setItem('analytics', JSON.stringify(events))
  }

  const trackPageView = (page: string) => {
    track('page_view', { page })
  }

  const trackDeployment = (repoUrl: string, status: string) => {
    track('deployment', { repoUrl, status })
  }

  return {
    track,
    trackPageView,
    trackDeployment
  }
}