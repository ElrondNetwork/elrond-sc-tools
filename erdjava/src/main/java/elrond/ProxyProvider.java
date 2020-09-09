package elrond;

import java.io.IOException;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class ProxyProvider implements IProvider {
    private final String url;
    private final OkHttpClient httpClient;

    public ProxyProvider(String url) {
        this.url = url;
        this.httpClient = new OkHttpClient();
    }

    public NetworkConfig getNetworkConfig() throws IOException {
        String json = this.doGet("network/config");
        ResponseOfGetNetworkConfig typedResponse = new Gson().fromJson(json, ResponseOfGetNetworkConfig.class);
        PayloadOfGetNetworkConfig payload = typedResponse.data.config;
        return NetworkConfig.fromProviderPayload(payload);
    }

    private String doGet(String resourceUrl) throws IOException {
        String getUrl = String.format("%s/%s", this.url, resourceUrl);
        Request request = new Request.Builder().url(getUrl).build();

        try (Response response = this.httpClient.newCall(request).execute()) {
            String json = response.body().string();
            return json;
        }
    }

    public static class ResponseBase<T> {
        @SerializedName(value = "data")
        public T data;

        @SerializedName(value = "error")
        public String error;

        @SerializedName(value = "code")
        public String code;
    }

    public static class ResponseOfGetNetworkConfig extends ResponseBase<WrapperOfGetNetworkConfig> {}

    public static class WrapperOfGetNetworkConfig {
        @SerializedName(value = "config")
        public PayloadOfGetNetworkConfig config;
    }

    public static class PayloadOfGetNetworkConfig {
        @SerializedName(value = "erd_chain_id")
        public String chainID;

        @SerializedName(value = "erd_gas_per_data_byte")
        public int gasPerDataByte;

        @SerializedName(value = "erd_min_gas_limit")
        public long minGasLimit;

        @SerializedName(value = "erd_min_gas_price")
        public long minGasPrice;

        @SerializedName(value = "erd_min_transaction_version")
        public int minTransactionVersion;
    }
}
