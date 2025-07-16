interface Window{
    electronAPI : any
}

interface Navigator {
  serial: Serial;
}

interface Serial {
  requestPort: () => Promise<any>;
  getPorts: () => Promise<any[]>;
}
