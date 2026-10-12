package com.example.job;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OrderTimeoutJob {
  @Scheduled(cron = "${app.order.timeout-job.cron:0 */5 * * * ?}")
  public void cancelTimeoutOrders() {
    // fixture only
  }
}
