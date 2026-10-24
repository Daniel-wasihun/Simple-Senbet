export default function CardSkeleton(...props) {
  return (
    <div className={`${props} animate-pulse bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md p-6 flex flex-col items-center text-center`}>
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" /> 
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" /> 
      <div className="space-y-2 w-full mb-4">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
      </div> 
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded mb-3" /> 
      <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}
