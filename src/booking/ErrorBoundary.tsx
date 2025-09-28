import React from "react";

type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
    state: State = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err: unknown) { console.error("booking-app crashed", err); }
    render() {
        if (this.state.hasError) {
            return <div className="card p-6">Booking module is currently unavailable.</div>;
        }
        return this.props.children;
    }
}
