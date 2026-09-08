import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep a breadcrumb for production debugging.
    console.error('AppErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-14">
        <div className="max-w-xl w-full border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
            Something Went Wrong
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
            We hit an unexpected error.
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Please reload the page. If the issue keeps happening, it may be a temporary server problem.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#3E2723] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:opacity-95"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
