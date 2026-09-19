import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-gutter text-center">
      <span className="font-display text-7xl font-bold text-orange-500">404</span>
      <h1 className="mt-4 text-2xl font-bold text-white">This page wandered off-camera</h1>
      <p className="mt-2 max-w-md text-white/60">
        The page you're looking for doesn't exist. Let's get you back to the Fanitt platform overview.
      </p>
      <Link to="/" className="mt-8">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
