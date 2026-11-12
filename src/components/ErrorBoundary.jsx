import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Tovia storefront error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <main className="error-fallback"><span>T</span><small>Something needs a little care</small><h1>Let’s restore<br />your luxe experience.</h1><p>Refresh the page to try again. Your saved items remain on this device.</p><button onClick={() => window.location.reload()}>Refresh storefront</button></main>;
    }
    return this.props.children;
  }
}
