import * as React from "react";
import { observer } from "mobx-react";
import { PlayerState } from "../state";
import { COMBINATIONS } from "../scoring";
import { app } from "../app";

interface Props {
  currentRoll: (number | null)[];
  currentRollCount: number;
  player: typeof PlayerState.Type;
  className?: string;
}

interface State {
  requestingUrl: string | null;
  error: string | null;
  hint: {keyI18n: string, value?: string, valueI18n?: string} | null;
}

@observer
export class Hint extends React.Component<Props, State> {
  request: XMLHttpRequest | null = null;

  state = {
    requestingUrl: null,
    error: null,
    hint: null
  };

  componentDidMount() {
    this.startRequest();
  }

  componentDidUpdate(_prevProps: Props, _prevState: State) {
    const url = this.getUrl();
    if (url === this.state.requestingUrl) {
      return;
    }
    if (this.state.requestingUrl && this.request) this.request.abort();
    if (url) this.startRequest();
  }

  getUrl(): string | null {
    let rollString = "";
    for (const v of this.props.currentRoll) {
      if (v === null) return null;
      rollString += v;
    }
    const base = "/hint/";
    const playerState: { [key: string]: number } = {};
    let gameOver = true;
    const sides = this.props.player.sides;
    if (sides) {
      const sidesKeys = "123456";
      for (let i = 0; i < sidesKeys.length; ++i) {
        const v = sides[i];
        if (v !== null) playerState[sidesKeys.charAt(i)] = v;
        else gameOver = false;
      }
    }
    const combinations = this.props.player.combinations;
    if (combinations) {
      const combinationsKeys = COMBINATIONS;
      for (let i = 0; i < combinationsKeys.length; ++i) {
        const v = combinations[i];
        if (v !== null) playerState[combinationsKeys.charAt(i)] = v;
        else gameOver = false;
      }
    }
    if (gameOver) return null;
    const state = encodeURIComponent(JSON.stringify(playerState));
    return (
      base +
      "?state=" +
      state +
      "&roll=" +
      rollString +
      "&roll_count=" +
      this.props.currentRollCount
    );
  }

  startRequest() {
    const url = this.getUrl();
    this.setState({ requestingUrl: url, hint: null, error: null });
    if (url === null) {
      this.request = null;
      return;
    }
    const httpRequest = (this.request = new XMLHttpRequest());
    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          const data = JSON.parse(httpRequest.responseText);
          if (!data)
            this.setState({
              error: "Bad response: " + httpRequest.responseText,
              hint: null
            });
          else if (Array.isArray(data.keep_first))
            this.setState({
              error: null,
              hint: {keyI18n: "keep", value: data.keep_first.join(", ")},
            });
          else if (Array.isArray(data.keep_second))
            this.setState({
              error: null,
              hint: {keyI18n: "keep", value: data.keep_second.join(", ")},
            });
          else if (typeof data.best_action === "string")
            this.setState({
              error: null,
              hint: {keyI18n: "pick", valueI18n: "comb" + data.best_action},
            });
          else
            this.setState({
              error:
                "No recognized key in response: " + httpRequest.responseText,
              hint: null
            });
        } else
          this.setState({ error: "HTTP " + httpRequest.status, hint: null });
      }
    };
    httpRequest.open("GET", url);
    httpRequest.send();
  }

  render() {
    let hint: string | null = null;
    const hintData = this.state.hint;
    if (hintData) {
      const {keyI18n, value, valueI18n} = hintData;
      hint = app.t(keyI18n) + (value || "") + (valueI18n ? app.t(valueI18n) : "");
    }
    return (
      <div className={this.props.className}>
        {this.getUrl() ? (
          <>
            {hint}
            {this.state.error}
          </>
        ) : null}
      </div>
    );
  }
}
