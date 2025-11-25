"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, BookOpen, Video } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface Tutorial {
  _id: string
  title: string
  description: string
  videoUrl: string
  category: string
  duration: string
}
export default function HelpPage() {
  const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null)
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const { t } = useLanguage()

  const getEmbedUrl = (url: string) => {
    if (!url) return ''
    // Convert YouTube watch URL to embed URL
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    // If already embed URL or other format, return as is
    return url
  }

  const getThumbnailUrl = (url: string) => {
    if (!url) return ''
    let videoId = ''
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0]
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ''
  }

  const fetchTutorials = async () => {
    try {
      const response = await fetch('/api/tutorials')
      if (response.ok) {
        const data = await response.json()
        setTutorials(data)
      }
    } catch (error) {
      console.error('Failed to fetch tutorials:', error)
    }
  }

  useEffect(() => {
    fetchTutorials()
  }, [])

  return (
    <MainLayout title={t('helpTutorials')}>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('helpVideoTutorials')}</h1>
            <p className="text-muted-foreground">{t('quickTutorialsDescription')}</p>
          </div>
        </div>

        {selectedVideo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedVideo.title}</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedVideo(null)}>
                  {t('close')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={getEmbedUrl(selectedVideo.videoUrl)}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial: Tutorial) => (
            <Card key={tutorial._id} className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden p-0">
              <CardContent className="p-0">
                <div 
                  className="relative aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden"
                  onClick={() => setSelectedVideo(tutorial)}
                >
                  {getThumbnailUrl(tutorial.videoUrl) ? (
                    <img 
                      src={getThumbnailUrl(tutorial.videoUrl)} 
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-16 w-16 text-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black/20 rounded-t-lg flex items-center justify-center hover:bg-black/30 transition-colors">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{tutorial.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {tutorial.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{tutorial.title}</h3>
                  <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}