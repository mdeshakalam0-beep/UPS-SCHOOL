"use client";

import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LiveStreamViewerProps {
  meetingLink: string;
  platform: string;
  title: string;
}

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({ meetingLink, platform, title }) => {
  const getEmbedUrl = (link: string, plat: string): string => {
    if (plat === 'YouTube') {
      // Convert YouTube watch URL to embed URL
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
      const match = link.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
    }
    // For Zoom or Other, try to use the link directly
    return link;
  };

  const embedUrl = getEmbedUrl(meetingLink, platform);

  // Special handling for Zoom as direct embedding is often blocked
  if (platform === 'Zoom') {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <AlertTitle className="text-xl font-bold mb-2">Zoom Meeting</AlertTitle>
        <AlertDescription className="text-muted-foreground mb-4">
          Zoom meetings often cannot be embedded directly due to security policies.
          Please join the meeting using the external link.
        </AlertDescription>
        <Button onClick={() => window.open(meetingLink, '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white">
          <ExternalLink className="mr-2 h-4 w-4" /> Join Zoom Meeting
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        style={{ border: 'none' }}
      ></iframe>
    </div>
  );
};

export default LiveStreamViewer;