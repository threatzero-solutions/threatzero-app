const CourseCustomTag: React.FC<{
  tag: string;
}> = ({ tag }) => {
  return (
    <span className="rounded-sm ring-2 ring-inset ring-gray-700 text-gray-700 text-xs font-semibold overflow-hidden inline-flex items-stretch">
      <span className="pr-1 pl-2 bg-gray-700 text-white py-1">Tag:</span>
      <span className="pl-1 pr-2 py-1">{tag}</span>
    </span>
  );
};

export default CourseCustomTag;
