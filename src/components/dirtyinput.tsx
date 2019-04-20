import * as React from "react";

interface Props {
	value: string;
	onChange: (v: string) => void;
	className?: string;
}

interface State {
	value: string;
	focus: boolean;
}

export class DirtyInput extends React.Component<Props, State> {
	state = {
		value: "",
		focus: false,
	}

	value() {
		return this.state.focus ? this.state.value : this.props.value;
	}

	onChange(s: string) {
		this.props.onChange(s);
		this.setState({value: s});
	}

	render() {
		return <input
			className={this.props.className}
			onChange={e => this.onChange(e.target.value)}
			value={this.value()}
			onFocus={() => this.setState({focus: true, value: this.props.value})}
			onBlur={() => this.setState({focus: false})}
			/>;
	}
}
