
package com.opportunityx.opportunityxbackend;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DatabaseTestController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseTestController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/database-test")
    public Map<String, Object> testDatabase() {
        String databaseName = jdbcTemplate.queryForObject(
            "SELECT DB_NAME()", String.class
        );

        return Map.of(
            "connected", true,
            "database", databaseName,
            "message", "Database connection successful!"
        );
    }
}
