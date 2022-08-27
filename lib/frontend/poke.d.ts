export declare type Receiver = (spaceID: string, onPoke: OnPoke) => Cancel;
export declare type OnPoke = () => Promise<void>;
export declare type Cancel = () => void;
export declare function getPokeReceiver(): Receiver;
