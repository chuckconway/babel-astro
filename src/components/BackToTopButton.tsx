/* @jsxImportSource react */
import React, { Component } from "react";

interface Props {
  /**
   * Optional custom class names to override default styling.
   */
  className?: string;
}

interface State {
  visible: boolean;
}

/**
 * BackToTopButton – shows an unobtrusive button centred in the post footer once
 * the reader has scrolled at least one viewport height. Clicking the button
 * smoothly scrolls the page back to the top.
 */
class BackToTopButton extends Component<Props, State> {
  state: State = {
    visible: false,
  };

  constructor(props: Props) {
    super(props);
    this.handleScroll = this.handleScroll.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this);
  }

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll() {
    const shouldBeVisible = window.scrollY > window.innerHeight; // one viewport
    if (shouldBeVisible !== this.state.visible) {
      this.setState({ visible: shouldBeVisible });
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  render() {
    if (!this.state.visible) return null;

    return (
      <button
        onClick={this.scrollToTop}
        className={
          this.props.className ??
          "bg-muted hover:bg-muted mx-auto mt-8 block rounded px-4 py-2 transition-colors"
        }
      >
        ↑ Back to top
      </button>
    );
  }
}

export default BackToTopButton;
