import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';

const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_GRAPHQL_TOKEN}`,
};

const mainnetClient = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_SUBGRAPH_MAINNET ||
      'https://api.studio.thegraph.com/query/66145/klerosboard-mainnet/version/latest',
    headers: authHeaders,
  }),
  cache: new InMemoryCache(),
});

const gnosisClient = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_SUBGRAPH_GNOSIS ||
      'https://api.studio.thegraph.com/query/66145/klerosboard-gnosis/version/latest',
    headers: authHeaders,
  }),
  cache: new InMemoryCache(),
});

const sepoliaClient = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_SUBGRAPH_SEPOLIA ||
      'https://api.studio.thegraph.com/query/66145/klerosboard-sepolia/version/latest',
    headers: authHeaders,
  }),
  cache: new InMemoryCache(),
});

const apolloClientQuery = async <T>(
  chainId: string,
  queryString: string,
  variables: Record<string, any> = {},
) => {
  if (chainId === '100')
    return apolloQuery<T>(gnosisClient, queryString, variables);
  if (chainId === '11155111')
    return apolloQuery<T>(sepoliaClient, queryString, variables);
  return apolloQuery<T>(mainnetClient, queryString, variables);
};

const apolloQuery = async <T>(
  client: ApolloClient,
  queryString: string,
  variables: Record<string, any> = {},
) => {
  try {
    return client.query<T>({
      query: gql(queryString),
      variables: variables,
    });
  } catch (err) {
    console.error('graph ql error: ', err);
  }
};

/**
 * Query the HyperIndex (Envio) curate subgraph.
 * Single endpoint for both mainnet (chainId=1) and gnosis (chainId=100).
 * Uses direct fetch instead of Apollo Client — no query builder needed.
 */
const CURATE_ENDPOINT = import.meta.env.VITE_CURATE_SUBGRAPH;

interface CurateVariables {
  [key: string]: any;
}

const curateQuery = async <T>(
  query: string,
  variables: CurateVariables = {},
): Promise<T> => {
  if (!CURATE_ENDPOINT) {
    console.error('VITE_CURATE_SUBGRAPH is not set');
    return {} as T;
  }

  try {
    const response = await fetch(CURATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    return json.data as T;
  } catch (err) {
    console.error('curate subgraph error: ', err);
    return {} as T;
  }
};

export { apolloClientQuery, curateQuery };
