import {
  ApolloClient,
  gql,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";

const mainnetClient = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/66145/klerosboard-mainnet/version/latest",
  cache: new InMemoryCache(),
});

const gnosisClient = new ApolloClient({
  uri: "https://gateway.thegraph.com/api/subgraphs/id/Ck26N16xgimEuuuNSJqYVWBKcWSwPmkk36BWZGtfx1ox",
  cache: new InMemoryCache(),
  headers: {
    "Content-Type": "application/json",
    // Leaked token, this is protected to be used only by klerosboard.com and this specific subgraph
    Authorization: `Bearer ${process.env.REACT_APP_GRAPHQL_TOKEN}`,
  },
});

const curateGnosisClient = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/61738/legacy-curate-xdai/version/latest",
  cache: new InMemoryCache(),
});

const curateMainnetClient = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/61738/legacy-curate-mainnet/version/latest",
  cache: new InMemoryCache(),
});

const apolloClientQuery = async <T>(
  chainId: string,
  queryString: string,
  variables: Record<string, any> = {}
) => {
  if (chainId === "100")
    return apolloQuery<T>(gnosisClient, queryString, variables);
  return apolloQuery<T>(mainnetClient, queryString, variables);
};

const apolloCurateGnosisQuery = async <T>(
  queryString: string,
  variables: Record<string, any> = {}
) => {
  return apolloQuery<T>(curateGnosisClient, queryString, variables);
};

const apolloCurateMainnetQuery = async <T>(
  queryString: string,
  variables: Record<string, any> = {}
) => {
  return apolloQuery<T>(curateMainnetClient, queryString, variables);
};

const apolloQuery = async <T>(
  client: ApolloClient<NormalizedCacheObject>,
  queryString: string,
  variables: Record<string, any> = {}
) => {
  try {
    return client.query<T>({
      query: gql(queryString),
      variables: variables,
    });
  } catch (err) {
    console.error("graph ql error: ", err);
  }
};

export { apolloClientQuery, apolloCurateGnosisQuery, apolloCurateMainnetQuery };
