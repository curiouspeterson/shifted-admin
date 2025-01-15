import { toast } from '@/components/ui/toast';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

type NetworkStatusCallback = (status: NetworkStatus) => void;

/**
 * Utility class for monitoring network status and conditions
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private callbacks: Set<NetworkStatusCallback> = new Set();
  private currentStatus: NetworkStatus = {
    isOnline: true,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private initialize(): void {
    // Set initial status
    this.currentStatus.isOnline = navigator.onLine;

    // Add online/offline listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Monitor connection quality if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.updateConnectionQuality(connection);

      connection.addEventListener('change', () => {
        this.updateConnectionQuality(connection);
      });
    }
  }

  private handleOnline(): void {
    this.currentStatus.isOnline = true;
    this.notifyCallbacks();
    
    toast({
      title: 'Connected',
      description: 'Your internet connection has been restored.',
      variant: 'default',
    });
  }

  private handleOffline(): void {
    this.currentStatus.isOnline = false;
    this.notifyCallbacks();
    
    toast({
      title: 'Disconnected',
      description: 'You are currently offline. Some features may be unavailable.',
      variant: 'destructive',
    });
  }

  private updateConnectionQuality(connection: any): void {
    this.currentStatus = {
      ...this.currentStatus,
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false,
    };

    this.notifyCallbacks();

    // Notify if connection is slow
    if (this.isConnectionSlow()) {
      toast({
        title: 'Slow Connection',
        description: 'Your internet connection is slow. Some features may be affected.',
        variant: 'destructive',
      });
    }
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkStatusCallback): () => void {
    this.callbacks.add(callback);
    // Immediately call with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if the connection is considered slow
   */
  isConnectionSlow(): boolean {
    const { effectiveType, downlink, rtt } = this.currentStatus;

    // Consider connection slow if:
    // 1. Effective type is 2G or slower
    // 2. Downlink is less than 1 Mbps
    // 3. RTT is greater than 500ms
    return (
      effectiveType === '2g' ||
      effectiveType === 'slow-2g' ||
      (downlink !== null && downlink < 1.0) ||
      (rtt !== null && rtt > 500)
    );
  }

  /**
   * Check if the device is in data saver mode
   */
  isSaveData(): boolean {
    return this.currentStatus.saveData;
  }

  /**
   * Get connection quality metrics
   */
  getConnectionMetrics(): {
    quality: 'good' | 'fair' | 'poor';
    description: string;
  } {
    const { effectiveType, downlink, rtt } = this.currentStatus;

    if (!this.currentStatus.isOnline) {
      return {
        quality: 'poor',
        description: 'Offline',
      };
    }

    if (this.isConnectionSlow()) {
      return {
        quality: 'poor',
        description: `Slow connection (${effectiveType}, ${downlink}Mbps, ${rtt}ms)`,
      };
    }

    if (
      (effectiveType === '4g' && downlink !== null && downlink > 5) ||
      (rtt !== null && rtt < 100)
    ) {
      return {
        quality: 'good',
        description: `Good connection (${effectiveType}, ${downlink}Mbps, ${rtt}ms)`,
      };
    }

    return {
      quality: 'fair',
      description: `Fair connection (${effectiveType}, ${downlink}Mbps, ${rtt}ms)`,
    };
  }
} 