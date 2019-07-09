import 'reflect-metadata';
import { Container as InversifyContainer } from 'inversify';

const Container: InversifyContainer = new InversifyContainer({
    autoBindInjectable: true,
    defaultScope: 'Singleton',
    skipBaseClassChecks: true
});

export default Container;