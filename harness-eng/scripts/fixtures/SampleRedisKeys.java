package fixtures;

import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;

/** fixture for fill-inventory-redis */
public final class SampleRedisKeys {
    public static final String CAPTCHA_CODE_KEY = "captcha_codes:";
    public static final String LOGIN_TOKEN_KEY = "login_tokens:";

    private final StringRedisTemplate redisTemplate;

    public SampleRedisKeys(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void cacheCaptcha(String code) {
        redisTemplate.opsForValue().set("captcha_codes:demo", code);
        redisTemplate.expire("captcha_codes:demo", Duration.ofMinutes(5));
    }

    public void cacheToken(Object user) {
        String json = JSON.toJSONString(user);
        redisTemplate.opsForValue().set("login_tokens:u1", json);
        redisTemplate.expire("login_tokens:u1", 3600);
    }

    private SampleRedisKeys() {
        this.redisTemplate = null;
    }
}

class JSON {
    static String toJSONString(Object o) {
        return String.valueOf(o);
    }
}
