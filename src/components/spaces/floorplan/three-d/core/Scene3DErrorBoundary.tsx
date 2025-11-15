import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableFallback?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

export class Scene3DErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Scene3DErrorBoundary: 3D scene error caught:', error, errorInfo);
    
    // Log specific Three.js/WebGL related errors
    if (error.message.includes('WebGL') || error.message.includes('THREE')) {
      console.error('Scene3DErrorBoundary: WebGL/Three.js specific error detected');
    }

    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      showDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <Card className="w-full h-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">3D Rendering Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                The 3D floor plan encountered an error and cannot be displayed.
              </p>
              
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 font-medium">
                    {this.state.error.message || 'Unknown error occurred'}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={this.handleReset} 
                  variant="default"
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload} 
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  Reload Page
                </Button>

                {this.state.error && (
                  <Button 
                    onClick={this.toggleDetails} 
                    variant="ghost"
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {this.state.showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                )}
              </div>

              {this.state.showDetails && this.state.error && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.error.stack || this.state.error.message}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4 className="font-medium text-gray-900 mb-2 mt-4">Component Stack:</h4>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Check if your browser supports WebGL</li>
                  <li>• Try refreshing the page</li>
                  <li>• Disable browser extensions that might interfere</li>
                  <li>• Update your graphics drivers</li>
                  <li>• Try using a different browser</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withScene3DErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <Scene3DErrorBoundary fallbackComponent={fallbackComponent}>
      <Component {...props} />
    </Scene3DErrorBoundary>
  );
  
  WrappedComponent.displayName = `withScene3DErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default Scene3DErrorBoundary;
