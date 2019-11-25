import { MiddlewareFn } from 'type-graphql';
import { ResolverContext } from '../../types/resolverContext';
import keycloak from 'keycloak-connect';

export const isAuth: MiddlewareFn<ResolverContext> = async (
  { context: { req, res } },
  next
) => {
  if (
    !req.headers.authorization &&
    req.headers.authorization!.split(' ')[0] === 'Bearer'
  ) {
    res.status(401).send();
    throw new Error('Not Authorized');
  }

  // TODO - verify jwt against keycloak

  return next();
};
