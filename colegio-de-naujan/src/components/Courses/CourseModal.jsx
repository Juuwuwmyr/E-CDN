import { useState } from 'react';

const CourseModal = ({ course, isOpen, onClose, colorBorder, colorPill }) => {
  if (!isOpen || !course) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg my-8">
          {/* Header with close button */}
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Placeholder */}
            <div
              className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-t-lg"
              style={{ borderBottom: `4px solid ${colorBorder[course.color]}` }}
            >
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 text-sm font-medium">Click to add course image</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Code Pill */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded"
                style={{
                  background: colorPill[course.color].bg,
                  color: colorPill[course.color].color,
                }}
              >
                {course.code}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: '#0F1422' }}>
              {course.full}
            </h2>

            {/* Description */}
            <p className="text-base mb-6" style={{ color: '#4E5873', lineHeight: 1.8 }}>
              {course.desc}
            </p>

            {/* Course Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
              {course.duration && (
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2" style={{ color: colorPill[course.color].color }}>
                    Duration
                  </h4>
                  <p style={{ color: '#4E5873' }}>{course.duration}</p>
                </div>
              )}
              {course.credits && (
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2" style={{ color: colorPill[course.color].color }}>
                    Credits
                  </h4>
                  <p style={{ color: '#4E5873' }}>{course.credits}</p>
                </div>
              )}
            </div>

            {/* Highlights */}
            {course.highlights && course.highlights.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: colorPill[course.color].color }}>
                  Key Features
                </h4>
                <ul className="space-y-2">
                  {course.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                        style={{ background: colorPill[course.color].color }}
                      />
                      <span style={{ color: '#4E5873' }}>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Career Paths */}
            {course.careerPaths && course.careerPaths.length > 0 && (
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: colorPill[course.color].color }}>
                  Career Paths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {course.careerPaths.map((path, i) => (
                    <span
                      key={i}
                      className="px-3 py-2 rounded-full text-xs font-medium"
                      style={{
                        background: colorPill[course.color].bg,
                        color: colorPill[course.color].color,
                      }}
                    >
                      {path}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="px-8 pb-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors"
              style={{
                background: `${colorPill[course.color].color}20`,
                color: colorPill[course.color].color,
              }}
              onMouseEnter={e => e.target.style.background = `${colorPill[course.color].color}30`}
              onMouseLeave={e => e.target.style.background = `${colorPill[course.color].color}20`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseModal;
