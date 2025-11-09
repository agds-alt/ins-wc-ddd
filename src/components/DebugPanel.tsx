// src/components/DebugPanel.tsx - View logs in real-time
import { useState, useEffect } from 'react';
import { X, Download, Trash2, Bug, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { logger } from '../lib/logger';

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Update logs every second
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Only show in dev mode
  if (process.env.NODE_ENV === 'production') return null;

  const handleExport = () => {
    const json = logger.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all logs?')) {
      logger.clearLogs();
      setLogs([]);
    }
  };

  const filteredLogs = filterLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === filterLevel);

  const getIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-50 border-red-200 text-red-900';
      case 'warn': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'debug': return 'bg-gray-50 border-gray-200 text-gray-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="w-6 h-6" />
          {stats.errors > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {stats.errors}
            </span>
          )}
        </button>
      )}

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-[80vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between sm:rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <Bug className="w-5 h-5" />
                <h2 className="font-bold">Debug Panel</h2>
                <span className="text-sm text-gray-400">
                  {filteredLogs.length} logs
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 grid grid-cols-5 gap-2 text-xs">
              <button
                onClick={() => setFilterLevel('all')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  filterLevel === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilterLevel('error')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  filterLevel === 'error' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-red-600 hover:bg-red-50'
                }`}
              >
                Errors ({stats.errors})
              </button>
              <button
                onClick={() => setFilterLevel('warn')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  filterLevel === 'warn' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-white text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                Warns ({stats.warnings})
              </button>
              <button
                onClick={() => setFilterLevel('info')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  filterLevel === 'info' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                Info ({stats.info})
              </button>
              <button
                onClick={() => setFilterLevel('debug')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  filterLevel === 'debug' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Debug ({stats.debug})
              </button>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleClear}
                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bug className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No logs yet</p>
                </div>
              ) : (
                [...filteredLogs].reverse().map((log, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {log.message}
                          </span>
                          <span className="text-xs opacity-60">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {log.data && (
                          <details className="text-xs mt-2">
                            <summary className="cursor-pointer opacity-75 hover:opacity-100">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-black/5 rounded overflow-auto max-h-40">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};