import * as React from "react";

interface PropsBase {
  className?: string;
}

interface PropsNumber {
  value: number | null;
  onChange: (v: number | null) => void;
  type: "number";
}

interface PropsText {
  value: string;
  onChange: (v: string) => void;
  type?: "string";
}

type Props = PropsBase & (PropsNumber | PropsText);

interface State {
  value: string;
  focus: boolean;
}

export class DirtyInput extends React.Component<Props, State> {
  state = {
    value: "",
    focus: false
  };

  value() {
    return this.state.focus
      ? this.state.value
      : this.props.value === null
      ? ""
      : this.props.value + "";
  }

  onChange(s: string) {
    if (this.props.type === "number") {
      const v = s === "" ? null : parseInt(s);
      if (v === v) this.props.onChange(v);
    } else {
      this.props.onChange(s);
    }
    this.setState({ value: s });
  }

  render() {
    return (
      <input
        type={this.props.type}
        className={this.props.className}
        onChange={e => this.onChange(e.target.value)}
        value={this.value()}
        onFocus={() =>
          this.setState({ focus: true, value: this.props.value + "" })
        }
        onBlur={() => this.setState({ focus: false })}
      />
    );
  }
}
