import { Loader } from "@/components/ui/loader";

export default function LoaderDemo() {
  return (
    <div className="space-y-8 p-6">
      {/* Basic loader with text */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Loader</h3>
        <Loader>
          <span className="text-black dark:text-white">Getting things ready…</span>
        </Loader>
      </div>

      {/* Different sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Different Sizes</h3>
        <div className="flex items-center gap-8">
          <Loader size="sm">
            <span className="text-black dark:text-white">Small</span>
          </Loader>
          <Loader size="md">
            <span className="text-black dark:text-white">Medium</span>
          </Loader>
          <Loader size="lg">
            <span className="text-black dark:text-white">Large</span>
          </Loader>
        </div>
      </div>

      {/* Different variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Different Variants</h3>
        <div className="flex items-center gap-8">
          <Loader variant="default">
            <span className="text-black dark:text-white">Spinner</span>
          </Loader>
          <Loader variant="dots">
            <span className="text-black dark:text-white">Dots</span>
          </Loader>
          <Loader variant="pulse">
            <span className="text-black dark:text-white">Pulse</span>
          </Loader>
        </div>
      </div>

      {/* Without text */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Without Text</h3>
        <Loader />
      </div>
    </div>
  );
}
