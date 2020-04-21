import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Swipeable } from "react-swipeable";
import { EpubView } from "..";
import defaultStyles from "./style";

class TocItem extends PureComponent {
  setLocation = () => {
    this.props.setLocation(this.props.href);
  };
  render() {
    const { label, styles } = this.props;
    return (
      <button onClick={this.setLocation} style={styles}>
        {label}
      </button>
    );
  }
}

TocItem.propTypes = {
  label: PropTypes.string,
  href: PropTypes.string,
  setLocation: PropTypes.func,
  styles: PropTypes.object
};

class ReactReader extends PureComponent {
  constructor(props) {
    super(props);
    this.readerRef = React.createRef();
    this.state = {
      expanedToc: false,
      toc: false
    };
  }
  toggleToc = () => {
    this.setState({
      expanedToc: !this.state.expanedToc
    });
  };

  next = () => {
    const { pageChange } = this.props;
    const node = this.readerRef.current;
    pageChange && pageChange(this.readerRef.current.location);
    node.nextPage();
  };

  prev = () => {
    const { pageChange } = this.props;
    const node = this.readerRef.current;
    pageChange && pageChange(this.readerRef.current.location);
    node.prevPage();
  };

  onTocChange = toc => {
    const { tocChanged } = this.props;
    this.setState(
      {
        toc: toc
      },
      () => tocChanged && tocChanged(toc)
    );
  };

  renderToc() {
    const { toc, expanedToc } = this.state;
    const { styles } = this.props;
    return (
      <div>
        <div style={styles.tocArea}>
          <div style={styles.toc}>
            {toc.map((item, i) => (
              <TocItem
                {...item}
                key={i}
                setLocation={this.setLocation}
                styles={styles.tocAreaButton}
              />
            ))}
          </div>
        </div>
        {expanedToc && (
          <div style={styles.tocBackground} onClick={this.toggleToc} />
        )}
      </div>
    );
  }

  makeRangeCfi(a, b) {
    const CFI = new ePub.CFI();
    const start = CFI.parse(a),
      end = CFI.parse(b);
    const cfi = {
      range: true,
      base: start.base,
      path: {
        steps: [],
        terminal: null
      },
      start: start.path,
      end: end.path
    };
    const len = cfi.start.steps.length;
    for (let i = 0; i < len; i++) {
      if (CFI.equalStep(cfi.start.steps[i], cfi.end.steps[i])) {
        if (i == len - 1) {
          // Last step is equal, check terminals
          if (cfi.start.terminal === cfi.end.terminal) {
            // CFI's are equal
            cfi.path.steps.push(cfi.start.steps[i]);
            // Not a range
            cfi.range = false;
          }
        } else cfi.path.steps.push(cfi.start.steps[i]);
      } else break;
    }
    cfi.start.steps = cfi.start.steps.slice(cfi.path.steps.length);
    cfi.end.steps = cfi.end.steps.slice(cfi.path.steps.length);

    return (
      "epubcfi(" +
      CFI.segmentString(cfi.base) +
      "!" +
      CFI.segmentString(cfi.path) +
      "," +
      CFI.segmentString(cfi.start) +
      "," +
      CFI.segmentString(cfi.end) +
      ")"
    );
  }

  getText() {
    const rendition = this.readerRef.current.rendition;
    const book = rendition.book;
    return book.getRange(
      this.makeRangeCfi(
        rendition.location.start.cfi,
        rendition.location.end.cfi
      )
    );
  }

  setLocation = loc => {
    const { locationChanged } = this.props;
    this.setState(
      {
        expanedToc: false
      },
      () => locationChanged && locationChanged(loc)
    );
  };

  renderTocToggle() {
    const { expanedToc } = this.state;
    const { styles } = this.props;
    return (
      <button
        style={Object.assign(
          {},
          styles.tocButton,
          expanedToc ? styles.tocButtonExpaned : {}
        )}
        onClick={this.toggleToc}
      >
        <span
          style={Object.assign({}, styles.tocButtonBar, styles.tocButtonBarTop)}
        />
        <span
          style={Object.assign({}, styles.tocButtonBar, styles.tocButtonBottom)}
        />
      </button>
    );
  }

  render() {
    const {
      title,
      showToc,
      loadingView,
      styles,
      locationChanged,
      swipeable,
      ...props
    } = this.props;
    const { toc, expanedToc } = this.state;
    return (
      <div style={styles.container}>
        <div
          style={Object.assign(
            {},
            styles.readerArea,
            expanedToc ? styles.containerExpaned : {}
          )}
        >
          {showToc && this.renderTocToggle()}
          <div style={styles.titleArea}>{title}</div>
          <Swipeable
            onSwipedRight={this.prev}
            onSwipedLeft={this.next}
            trackMouse
          >
            <div style={styles.reader}>
              <EpubView
                ref={this.readerRef}
                loadingView={loadingView}
                {...props}
                tocChanged={this.onTocChange}
                locationChanged={locationChanged}
              />
              {swipeable && <div style={styles.swipeWrapper} />}
            </div>
          </Swipeable>
          <button
            style={Object.assign({}, styles.arrow, styles.prev)}
            onClick={this.prev}
          >
            ‹
          </button>
          <button
            style={Object.assign({}, styles.arrow, styles.next)}
            onClick={this.next}
          >
            ›
          </button>
        </div>
        {showToc && toc && this.renderToc()}
      </div>
    );
  }
}

ReactReader.defaultProps = {
  loadingView: <div style={defaultStyles.loadingView}>Loading…</div>,
  locationChanged: null,
  tocChanged: null,
  showToc: true,
  pageChange: null,
  styles: defaultStyles
};

ReactReader.propTypes = {
  title: PropTypes.string,
  loadingView: PropTypes.element,
  showToc: PropTypes.bool,
  locationChanged: PropTypes.func,
  tocChanged: PropTypes.func,
  styles: PropTypes.object,
  swipeable: PropTypes.bool,
  pageChange: PropTypes.func
};

export default ReactReader;
