import { ClipLoader } from 'react-spinners';

interface LoadingProps {
  size?: number;
  fullPage?: boolean;
}

export default function Loading({ size = 50, fullPage = true }: LoadingProps) {
  if (fullPage) {
    return (
      <div className="spinner-wrapper">
        <ClipLoader color="#D4A373" size={size} />
      </div>
    );
  }

  return <ClipLoader color="#D4A373" size={size} />;
}
