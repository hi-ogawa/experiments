import React from "react";

interface Props {
	children?: React.ReactNode;
	Fallback: React.FC;
}

interface State {
	error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
	state = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	override render() {
		const { error } = this.state;
		const { children, Fallback } = this.props;
		return error ? <Fallback /> : children;
	}
}
