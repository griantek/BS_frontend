import { Spinner } from "@nextui-org/react";

export const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex justify-center items-center h-[400px]">
    <div className="flex flex-col items-center gap-2">
      <Spinner size="lg" />
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  </div>
);

// Full screen version for page loading
export const PageLoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="flex flex-col items-center gap-2">
      <Spinner size="lg" />
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  </div>
);
